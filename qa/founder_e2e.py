"""Founder Control Center e2e on a CI-built app + THROWAWAY sqlite db.
Checks: gating (anonymous / normal user -> 404, founder -> 200), honest zeros, then exact numbers after seeding."""
import json, subprocess, sys, time
from playwright.sync_api import sync_playwright
base = sys.argv[1].rstrip('/'); ADMIN = 'gentikoltraka28@gmail.com'; PW = 'correct-horse-battery-9'
fails = []
def check(name, cond, detail=''):
    print(('PASS ' if cond else 'FAIL ') + name, detail)
    if not cond: fails.append(name)
with sync_playwright() as p:
    pw = p.request
    anon = pw.new_context(base_url=base); r = anon.get('/api/admin/founder/overview'); check('anonymous -> 404', r.status == 404, r.status)
    user = pw.new_context(base_url=base); user.post('/api/auth/register', data={'email': f'plain.{int(time.time())}@example.test', 'password': PW})
    r = user.get('/api/admin/founder/overview'); check('ordinary signed-in user -> 404', r.status == 404, r.status)
    founder = pw.new_context(base_url=base); rr = founder.post('/api/auth/register', data={'email': ADMIN, 'password': PW}); check('founder register/session', rr.status in (200, 201), rr.status)
    if rr.status not in (200, 201): founder.post('/api/auth/login', data={'email': ADMIN, 'password': PW})
    r = founder.get('/api/admin/founder/overview?days=30'); check('founder -> 200', r.status == 200, r.status)
    d0 = r.json()['metrics']
    check('zero revenue is zero (verified)', d0['grossRevenue']['value'] == 0 and d0['grossRevenue']['status'] == 'verified')
    check('refunds not connected', d0['refunds']['status'] == 'not_connected' and d0['refunds']['value'] is None)
    check('operating profit not connected', d0['operatingProfit']['status'] == 'not_connected')
    check('registered users counts real accounts only', d0['registeredUsers']['value'] == 2, d0['registeredUsers']['value'])
    s = subprocess.run(['node', 'qa/seed_founder_test.mjs', ADMIN], capture_output=True, text=True); print(s.stdout, s.stderr[-300:])
    check('seed ok', s.returncode == 0)
    full = founder.get('/api/admin/founder/overview?days=30').json(); m = full['metrics']
    check('gross revenue = 35.00 (open + complimentary excluded)', m['grossRevenue']['value'] == 35.0, m['grossRevenue']['value'])
    check('unique buyers = 2', m['uniqueBuyers']['value'] == 2, m['uniqueBuyers']['value'])
    check('complimentary counted separately = 1', m['complimentaryGrants']['value'] == 1)
    check('AI cost 0.5 flagged estimated (1 uncosted spend)', m['aiCost']['value'] == 0.5 and m['aiCost']['status'] == 'estimated', m['aiCost'])
    check('revenue minus AI cost = 34.5 estimated, not profit', m['grossRevenueMinusAiCost']['value'] == 34.5 and m['grossRevenueMinusAiCost']['status'] == 'estimated')
    check('active 24h counts the seeded user', m['dau']['value'] == 1, m['dau']['value'])
    pr = [x for x in full['providers'] if x['provider'] == 'zai']
    check('provider row: 3 requests, 1 failed, avg 667 ms', len(pr) == 1 and pr[0]['requests'] == 3 and pr[0]['failed'] == 1 and pr[0]['avgLatencyMs'] == 667, pr)
    check('provider balance not invented', full['providerBalances']['status'] == 'not_connected')
    check('no key/secret-like fields in payload', not any(k in json.dumps(full).lower() for k in ('api_key', 'secret', 'sk-', 'bearer')))
print('\nFAILED: ' + ', '.join(fails) if fails else '\nALL FOUNDER CHECKS PASSED'); sys.exit(1 if fails else 0)
