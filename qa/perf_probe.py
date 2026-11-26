"""Measured stability baseline: mobile emulation + 4x CPU throttle on a page, sampled over time.
Reports heap, DOM nodes, event listeners, long tasks, layout/style recalcs, requests and bytes,
oversized images and active animations. Read-only; no cookies or content are printed."""
import json, sys, time
from playwright.sync_api import sync_playwright
base = sys.argv[1].rstrip('/'); path = sys.argv[2] if len(sys.argv) > 2 else '/'
label = sys.argv[3] if len(sys.argv) > 3 else 'run'
out = {'label': label, 'url': base + path}
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True,
                        user_agent='Mozilla/5.0 (Linux; Android 12; SM-A125F) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36')
    pg = ctx.new_page()
    cdp = ctx.new_cdp_session(pg)
    cdp.send('Performance.enable'); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    reqs = []; sizes = {}
    pg.on('response', lambda r: reqs.append((r.request.resource_type, r.url.split('?')[0][-70:], r.status)))
    pg.add_init_script("""
      window.__lt=[]; try{ new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lt.push(Math.round(e.duration))}).observe({type:'longtask',buffered:true}) }catch(e){}
      window.__intervals=0; const si=window.setInterval; window.setInterval=function(){window.__intervals++; return si.apply(this,arguments)};
      window.__raf=0; const raf=window.requestAnimationFrame; window.requestAnimationFrame=function(){window.__raf++; return raf.apply(this,arguments)};
    """)
    t0 = time.time()
    pg.goto(base + path, wait_until='load', timeout=90000)
    out['load_s'] = round(time.time() - t0, 1)
    def sample(tag):
        m = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
        d = pg.evaluate("""()=>({
          imgs:[...document.images].filter(i=>i.complete&&i.naturalWidth>0).map(i=>({n:i.naturalWidth*i.naturalHeight,r:Math.max(1,i.clientWidth*i.clientHeight)})).filter(o=>o.n>o.r*4*4&&o.n>600000).length,
          imgsTotal:document.images.length, canvases:document.querySelectorAll('canvas').length, videos:document.querySelectorAll('video').length,
          audios:document.querySelectorAll('audio').length, iframes:document.querySelectorAll('iframe').length,
          anims:document.getAnimations().filter(a=>a.playState==='running').length,
          backdrop:[...document.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return (s.backdropFilter&&s.backdropFilter!=='none')||(s.webkitBackdropFilter&&s.webkitBackdropFilter!=='none')}).length,
          longtasks:window.__lt.length, longtaskMs:window.__lt.reduce((a,b)=>a+b,0), intervals:window.__intervals, rafCalls:window.__raf,
          sw:!!navigator.serviceWorker && !!navigator.serviceWorker.controller })""")
        out.setdefault('samples', []).append({'t': tag, 'heapMB': round(m.get('JSHeapUsedSize', 0) / 1e6, 1), 'nodes': int(m.get('Nodes', 0)),
            'listeners': int(m.get('JSEventListeners', 0)), 'layouts': int(m.get('LayoutCount', 0)), 'recalcs': int(m.get('RecalcStyleCount', 0)),
            'scriptS': round(m.get('ScriptDuration', 0), 2), 'taskS': round(m.get('TaskDuration', 0), 2), **d})
    time.sleep(3); sample('t+3s')
    time.sleep(12); sample('t+15s')
    for _ in range(6):
        pg.mouse.wheel(0, 900); time.sleep(0.6)
    sample('after-scroll')
    time.sleep(20); sample('idle+20s')
    out['requests_total'] = len(reqs)
    by = {}
    for t, u, s in reqs: by[t] = by.get(t, 0) + 1
    out['requests_by_type'] = by
    rep = {}
    for t, u, s in reqs: rep[u] = rep.get(u, 0) + 1
    out['repeated_urls'] = sorted([(c, u) for u, c in rep.items() if c > 1], reverse=True)[:8]
    out['non2xx'] = [f'{s} {u}' for t, u, s in reqs if s >= 400][:10]
    b.close()
print(json.dumps(out, indent=1))
