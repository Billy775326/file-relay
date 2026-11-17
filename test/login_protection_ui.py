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
    page.click('#admin-security-tab')
    expect(page.locator('#sec-add')).to_be_enabled()
    expect(page.locator('.sec-rule-summary').first).to_contain_text('10 分钟 5 次')
    expect(page.locator('.sec-table tbody tr')).to_have_count(1)
    expect(page.locator('.sec-address')).to_contain_text('2001:db8::42')
    for lang in ['zh', 'en']:
        if lang == 'en':
            page.click('#lang-btn')
            expect(page.locator('.sec-rule-summary').first).to_contain_text('30 min ban')
        for theme in ['light', 'dark']:
            page.evaluate('(v) => document.documentElement.dataset.theme = v', theme)
            for width in [320, 390, 1135]:
                page.set_viewport_size({'width': width, 'height': 844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                expect(page.locator('.sec-row-actions button').last).to_be_visible()
    page.locator('.sec-row-actions button').last.click()
    page.locator('#security-dialog .source-footer').get_by_role('button',name='Unban',exact=True).click()
    expect(page.locator('#sec-list')).to_contain_text('No active bans')
    assert context.request.get(base + '/api/admin/login-protection').json()['bans'] == []
    page.route('**/api/admin/security', lambda r: r.fulfill(status=503, json={'message': 'Storage unavailable'}))
    page.locator('#security-view').get_by_role('button',name='Refresh',exact=True).click()
    expect(page.locator('#sec-list')).to_contain_text('Failed to load')
    page.unroute('**/api/admin/security')
    page.locator('#security-view').get_by_role('button',name='Retry',exact=True).click()
    expect(page.locator('#sec-list')).to_contain_text('No active bans')
    # Exercise actual login errors and lockout on an isolated browser without admin cookies.
    visitor = browser.new_context()
    visitor.add_init_script("localStorage.setItem('lang', 'zh')")
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
