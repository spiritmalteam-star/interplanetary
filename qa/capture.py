import argparse, json, re
from pathlib import Path
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright

p=argparse.ArgumentParser()
p.add_argument('--base',default='https://www.reflectme.space')
p.add_argument('--out',default='captures')
p.add_argument('--route',action='append',default=[])
a=p.parse_args(); out=Path(a.out); out.mkdir(parents=True,exist_ok=True)
results=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch()
    for i,route in enumerate(dict.fromkeys(['/']+a.route)):
        url=urljoin(a.base,route)
        if urlparse(url).netloc != urlparse(a.base).netloc: continue
        for w,h in [(320,720),(360,800),(390,844),(430,932),(768,1024),(1440,900)]:
            name=f'{i:02d}_{w}x{h}'
            context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,is_mobile=w<500,has_touch=w<500)
            page=context.new_page(); errors=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            page.on('console',lambda m: errors.append(m.text) if m.type=='error' else None)
            failed=[]
            page.on('response',lambda r: failed.append(f'{r.status} {r.url[:200]}') if r.status>=400 else None)
            row={'url':url,'viewport':[w,h],'id':name,'errors':errors,'failed_requests':failed}
            try:
                response=page.goto(url,wait_until='domcontentloaded',timeout=45000)
                page.wait_for_timeout(2500)
                row['status']=response.status if response else None
                row['final_url']=page.url
                page.screenshot(path=str(out/f'{name}_viewport.png'),animations='disabled',timeout=20000)
                row['layout']=page.evaluate('''() => ({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,buttons:[...document.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().width>0).length,scrollRegions:[...document.querySelectorAll('body *')].filter(x=>x.clientHeight>0&&x.scrollHeight>x.clientHeight+8&&/auto|scroll/.test(getComputedStyle(x).overflowY)).map(x=>({tag:x.tagName,id:x.id,height:x.clientHeight})).slice(0,40)})''')
                page.screenshot(path=str(out/f'{name}_full.png'),full_page=True,animations='disabled',timeout=30000)
            except Exception as e: row['capture_error']=str(e)
            finally:
                results.append(row); context.close()
                (out/'results.json').write_text(json.dumps(results,indent=2))
    browser.close()
print(f'Capture attempts: {len(results)}; inspect {out}/results.json for failures.')
