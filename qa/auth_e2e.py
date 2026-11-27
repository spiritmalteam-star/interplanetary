"""Sign-in persistence e2e against a CI-built app with a throwaway SQLite db (no production data).
register -> reload -> new tab -> wait -> open profile; records what a visitor would see."""
import json, sys, time, os
from playwright.sync_api import sync_playwright
base = sys.argv[1].rstrip('/'); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
email = f"e2e.{int(time.time())}@example.test"; pw = "correct-horse-battery-9"
res = {'email_domain': 'example.test'}
def me(pg): return pg.evaluate("fetch('/api/auth/me',{cache:'no-store'}).then(r=>r.json().then(j=>({s:r.status,email:j.user&&j.user.email,anon:!!(j.user&&String(j.user.email).startsWith('anon:'))})))")
def visible(pg):
    return pg.evaluate("""()=>{const t=document.body.innerText;return {
      signInWords:(t.match(/sign in|log in|sign up|create account/gi)||[]).length,
      hasEmail:t.includes(%s), authDialogOpen:!!document.querySelector('[data-testid="passage-submit"]')}}""" % json.dumps(email))
with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    pg = ctx.new_page()
    pg.goto(base + '/', wait_until='networkidle', timeout=60000); pg.wait_for_timeout(1500)
    res['guest_me'] = me(pg)
    r = ctx.request.post(base + '/api/auth/register', data={'email': email, 'password': pw, 'name': 'E2E Visitor'})
    res['register_status'] = r.status
    try: res['register_body_keys'] = sorted(r.json().keys())
    except Exception: pass
    ck = [c for c in ctx.cookies() if 'session' in c['name'].lower() or 'mirror' in c['name'].lower() or 'auth' in c['name'].lower()]
    res['cookies'] = [{k: c[k] for k in ('name', 'httpOnly', 'secure', 'sameSite', 'expires')} for c in ck]
    pg.reload(wait_until='networkidle'); pg.wait_for_timeout(2500)
    res['after_reload_me'] = me(pg); res['after_reload_view'] = visible(pg); pg.screenshot(path=f'{out}/1-reload.png')
    pg2 = ctx.new_page(); pg2.goto(base + '/', wait_until='networkidle'); pg2.wait_for_timeout(2500)
    res['new_tab_me'] = me(pg2); res['new_tab_view'] = visible(pg2)
    try:
        pg2.locator('[data-testid="banner-profile-mark"]').first.click(timeout=8000); pg2.wait_for_timeout(1800)
        res['profile_view'] = visible(pg2); pg2.screenshot(path=f'{out}/2-profile.png')
    except Exception as e: res['profile_click_err'] = str(e)[:90]
    pg2.wait_for_timeout(20000); res['after_wait_me'] = me(pg2)
    # a signed-out login, then back in
    ctx.clear_cookies(); r2 = ctx.request.post(base + '/api/auth/login', data={'email': email, 'password': pw}); res['login_status'] = r2.status
    pg3 = ctx.new_page(); pg3.goto(base + '/', wait_until='networkidle'); pg3.wait_for_timeout(2500)
    res['after_login_me'] = me(pg3); res['after_login_view'] = visible(pg3); pg3.screenshot(path=f'{out}/3-after-login.png')
    b.close()
json.dump(res, open(f'{out}/auth-e2e.json', 'w'), indent=1); print(json.dumps(res, indent=1))
