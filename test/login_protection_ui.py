import sys
from playwright.sync_api import sync_playwright, expect

base = sys.argv[1].rstrip('/')
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width': 390, 'height': 844})
    context.add_init_script("localStorage.setItem('lang', 'zh')")
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    # The isolated fixture has no share schema: mock unrelated statistics and lists only.
    page.route('**/api/admin/stats', lambda r: r.fulfill(json={'total': 0, 'active': 0, 'files': 0, 'texts': 0, 'todayCreated': 0, 'totalBytes': 0}))
    page.route('**/api/admin/shares?*', lambda r: r.fulfill(json={'total': 0, 'rows': []}))
    auth = context.request.post(base + '/api/admin/login', data={'token': 'guard-test-only'})
    assert auth.status == 200
    page.goto(base + '/admin')
    page.locator('#login-protection summary').click()
    expect(page.locator('#login-guard-status')).to_contain_text('10 分钟内失败 5 次')
    expect(page.locator('.login-guard-row')).to_have_count(1)
    expect(page.locator('.login-guard-info b')).to_have_text('2001:db8::42')
    for lang in ['zh', 'en']:
        if lang == 'en':
            page.click('#lang-btn')
            expect(page.locator('#login-guard-status')).to_contain_text('block login for 30 minutes')
        for theme in ['light', 'dark']:
            page.evaluate('(v) => document.documentElement.dataset.theme = v', theme)
            for width in [320, 390, 1135]:
                page.set_viewport_size({'width': width, 'height': 844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                assert page.locator('.login-guard-row button').is_visible()
                if lang == 'zh' and theme == 'dark' and width == 390:
                    page.screenshot(path='.wrangler/login-protection-390.png')
    page.locator('.login-guard-row button').click()
    expect(page.locator('#login-guard-bans')).to_contain_text('No blocked IPs')
    assert context.request.get(base + '/api/admin/login-protection').json()['bans'] == []
    page.route('**/api/admin/login-protection', lambda r: r.fulfill(status=503, json={'message': 'Storage unavailable'}))
    page.click('#login-guard-refresh')
    expect(page.locator('#login-guard-error')).to_have_text('Storage unavailable')
    expect(page.locator('#login-guard-refresh')).to_be_enabled()
    page.unroute('**/api/admin/login-protection')
    page.click('#login-guard-refresh')
    expect(page.locator('#login-guard-bans')).to_contain_text('No blocked IPs')
    # Exercise actual login errors and lockout on an isolated browser without admin cookies.
    visitor = browser.new_context()
    login = visitor.new_page()
    login.goto(base + '/admin')
    login.fill('#admin-token', 'wrong')
    for i in range(5):
        with login.expect_response('**/api/admin/login') as response:
            login.click('#btn-login')
        assert response.value.status == (429 if i == 4 else 401)
        expect(login.locator('#btn-login')).to_be_enabled()
    expect(login.locator('#login-error')).to_contain_text('登录失败次数过多')
    assert not errors, errors
    browser.close()
print('PASS login protection UI: authenticated list/unblock, live lockout, retry, themes, languages, 320/390/1135 layouts')
