"""Read-only production smoke + technical-SEO probe (no JS, like a crawler). Usage: seo_probe.py BASE [ALT_HOST_BASE]"""
import sys, re, json, time, urllib.request, urllib.error
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
op = urllib.request.build_opener(NoRedirect)
def get(url, ua='Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'):
    t = time.time()
    try:
        r = op.open(urllib.request.Request(url, headers={'User-Agent': ua}), timeout=30)
        code, h, body = r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        code, h, body = e.code, dict(e.headers), e.read()
    except Exception as e:
        return {'url': url, 'error': str(e)[:100]}
    return {'url': url, 'status': code, 'ttfb_s': round(time.time() - t, 2), 'h': {k.lower(): v for k, v in h.items()}, 'body': body.decode('utf-8', 'replace'), 'bytes': len(body)}
out = {}
for base in sys.argv[1:]:
    base = base.rstrip('/'); r = get(base + '/')
    d = {'status': r.get('status'), 'location': r.get('h', {}).get('location'), 'error': r.get('error')}
    if r.get('body') and r['status'] == 200:
        b = r['body']
        txt = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', b, flags=re.S)
        txt = re.sub(r'<[^>]+>', ' ', txt); txt = re.sub(r'\s+', ' ', txt).strip()
        g = lambda p: (re.search(p, b, re.I | re.S) or [None, None])[1]
        d.update({'ttfb_s': r['ttfb_s'], 'html_bytes': r['bytes'], 'visible_text_chars_no_js': len(txt),
                  'lang': g(r'<html[^>]*\blang="([^"]*)"'), 'title': g(r'<title[^>]*>(.*?)</title>'),
                  'meta_description': bool(re.search(r'<meta[^>]+name="description"', b)),
                  'canonical': g(r'<link[^>]+rel="canonical"[^>]+href="([^"]*)"'),
                  'hreflang': len(re.findall(r'hreflang=', b)), 'jsonld_blocks': len(re.findall(r'application/ld\+json', b)),
                  'og_image': bool(re.search(r'property="og:image"', b)), 'h1_count': len(re.findall(r'<h1[\s>]', b)),
                  'noindex': bool(re.search(r'name="robots"[^>]+noindex', b)),
                  'security_headers': {k: (r['h'].get(k) is not None) for k in ['strict-transport-security', 'content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy']},
                  'cache_control': r['h'].get('cache-control')})
    out[base] = d
b0 = sys.argv[1].rstrip('/')
for path in ['/robots.txt', '/sitemap.xml', '/api/health', '/manifest.webmanifest', '/llms.txt', '/this-page-should-404-xyz']:
    r = get(b0 + path)
    e = {'status': r.get('status'), 'ct': r.get('h', {}).get('content-type'), 'bytes': r.get('bytes')}
    if path == '/robots.txt' and r.get('body'): e['text'] = r['body'][:600]
    if path == '/sitemap.xml' and r.get('body'): e['urls'] = len(re.findall(r'<loc>', r['body']))
    out[path] = e
print(json.dumps(out, indent=1))
