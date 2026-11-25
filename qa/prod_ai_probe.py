"""Read-only: ask the PRODUCTION intelligence one short question per mode and print
status + error code only (never cookies, never keys, never answer text beyond length)."""
import json, sys, urllib.request, urllib.error, http.cookiejar
base = sys.argv[1].rstrip('/')
jar = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
def call(path, body=None, method='POST', stream=False):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(base + path, data=data, method=method, headers={'content-type': 'application/json', 'user-agent': 'reflectme-qa-probe'})
    try:
        r = op.open(req, timeout=120); st = r.status; ct = r.headers.get('content-type', ''); raw = r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        st = e.code; ct = e.headers.get('content-type', ''); raw = e.read().decode('utf-8', 'replace')
    except Exception as e:
        return {'path': path, 'exc': repr(e)[:160]}
    out = {'path': path, 'status': st, 'ct': ct[:40], 'len': len(raw)}
    try:
        j = json.loads(raw); out['json_keys'] = list(j)[:8]
        for k in ('error', 'code', 'message'):
            if k in j: out[k] = str(j[k])[:140]
        if 'transmission' in j: out['answer_len'] = len(j['transmission'])
    except Exception:
        out['head'] = raw[:160].replace('\n', ' ')
        out['sse_has_done'] = '"done"' in raw
        out['sse_has_error'] = '"error"' in raw
    return out
res = []
res.append(call('/api/wallet', method='GET'))
Q = 'In one sentence, what is a mirror?'
for mode in ['mirror', 'absolute', 'hyperx', 'omni']:
    res.append({'mode': mode, **call('/api/transmission', {'query': Q, 'mode': mode, 'language': 'en'})})
res.append({'mode': 'hyperx-stream', **call('/api/transmission', {'query': Q, 'mode': 'hyperx', 'language': 'en', 'stream': True})})
res.append(call('/api/mirror-os', {'query': Q, 'language': 'en', 'walk': [], 'history': []}))
print(json.dumps(res, indent=1))
