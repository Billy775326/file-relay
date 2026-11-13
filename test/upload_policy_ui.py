import sys
from playwright.sync_api import sync_playwright, expect

base = sys.argv[1].rstrip('/')
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width': 390, 'height': 844})
    context.add_init_script("if (!localStorage.getItem('lang')) localStorage.setItem('lang','zh')")
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + '/')
    expect(page.locator('#upload-policy-hint')).to_contain_text('5 / 5')
    expect(page.locator('#dz-hint')).to_contain_text('9.9 GB')
    expect(page.locator('#seg-expiry [data-v="forever"]')).to_be_disabled()
    expect(page.locator('#seg-pickups [data-v="null"]')).to_be_disabled()
    page.set_input_files('#file-input', {'name': 'guest.txt', 'mimeType': 'text/plain', 'buffer': b'abc'})
    page.click('#btn-upload')
    expect(page.locator('#upload-policy-hint')).to_contain_text('4 / 5')
    code = ''.join(page.locator('#results .result .code').first.inner_text().split())
    assert len(code) == 6
    admin_context = browser.new_context(viewport={'width': 390, 'height': 844})
    admin_context.add_init_script("if (!localStorage.getItem('lang')) localStorage.setItem('lang','zh')")
    admin = admin_context.new_page()
    admin.on('pageerror', lambda error: errors.append(str(error)))
    admin.goto(base + '/admin')
    admin.fill('#admin-token', 'policy-test-only')
    admin.click('#btn-login')
    expect(admin.locator('#guest-weekly')).to_have_value('5')
    expect(admin.locator('#guest-size')).to_have_count(0)
    admin.locator('[data-i18n="ad.guestLimits"]').click()
    admin.fill('#guest-weekly', '2')
    admin.click('#guest-save')
    expect(admin.locator('#guest-save')).to_be_enabled()
    assert admin.request.get(base + '/api/admin/upload-policy').json() == {'weeklyFileLimit': 2}
    admin.reload()
    expect(admin.locator('#guest-weekly')).to_have_value('2')
    admin.locator('[data-i18n="ad.guestLimits"]').click()
    page.reload()
    expect(page.locator('#upload-policy-hint')).to_contain_text('1 / 2')
    expect(page.locator('#dz-hint')).to_contain_text('9.9 GB')
    page.set_input_files('#file-input', {'name': 'large.bin', 'mimeType': 'application/octet-stream', 'buffer': b'x' * 1_000_001})
    expect(page.locator('#file-list .file-row')).to_have_count(1)
    assert admin.request.put(base + f'/api/admin/shares/{code}/source', data={'note': 'trusted test'}).status == 200
    page.reload()
    expect(page.locator('#seg-expiry [data-v="forever"]')).to_be_enabled()
    expect(page.locator('#seg-pickups [data-v="null"]')).to_be_enabled()
    expect(page.locator('#dz-hint')).to_contain_text('9.9 GB')
    expect(page.locator('#upload-policy-hint')).to_be_empty()
    assert admin.request.put(base + f'/api/admin/shares/{code}/source', data={'note': ''}).status == 200
    page.reload()
    expect(page.locator('#seg-expiry [data-v="forever"]')).to_be_disabled()
    for theme in ['dark', 'light']:
        for width in [320, 390, 1135]:
            for target in [page, admin]:
                target.evaluate('(theme)=>document.documentElement.dataset.theme=theme', theme)
                target.set_viewport_size({'width': width, 'height': 844})
                assert target.evaluate('document.documentElement.scrollWidth <= innerWidth')
            if theme == 'dark' and width == 390:
                page.screenshot(path='.wrangler/upload-policy-guest-390.png', animations='disabled')
                admin.screenshot(path='.wrangler/upload-policy-admin-390.png', animations='disabled')
    page.click('#lang-btn')
    expect(page.locator('#upload-policy-hint')).to_contain_text('1 / 2 files left')
    page.set_input_files('#file-input', {'name': 'last.txt', 'mimeType': 'text/plain', 'buffer': b'abc'})
    page.click('#btn-upload')
    expect(page.locator('#upload-policy-hint')).to_contain_text('0 / 2 files left')
    expect(page.locator('#btn-upload')).to_be_disabled()
    # A rejected part is not retried and its multipart session is aborted.
    assert admin.request.put(base + '/api/admin/upload-policy', data={'weeklyFileLimit': 3, 'maxFileSizeMB': 1}).status == 200
    page.reload()
    expect(page.locator('#upload-policy-hint')).to_contain_text('1 / 3 files left')
    part_calls, abort_responses = [], []
    def reject_part(route):
        part_calls.append(route.request.url)
        route.fulfill(status=403, content_type='application/json', body='{"error":"upload_policy_changed","message":"Permission changed"}')
    page.route('**/api/uploads/*/parts/*', reject_part)
    page.on('response', lambda response: abort_responses.append(response.status) if response.url.endswith('/abort') else None)
    page.set_input_files('#file-input', {'name': 'rejected.txt', 'mimeType': 'text/plain', 'buffer': b'abc'})
    page.click('#btn-upload')
    expect(page.locator('#upload-policy-hint')).to_contain_text('0 / 3 files left')
    assert len(part_calls) == 1, part_calls
    assert abort_responses == [200], abort_responses
    admin.route('**/api/admin/upload-policy', lambda route: route.fulfill(status=503, content_type='application/json', body='{"message":"Temporary failure"}'))
    admin.fill('#guest-weekly', '4')
    admin.click('#guest-save')
    expect(admin.locator('#guest-error')).to_contain_text('Temporary failure')
    expect(admin.locator('#guest-weekly')).to_have_value('4')
    assert admin.request.get(base + '/api/admin/upload-policy').json()['weeklyFileLimit'] == 3
    admin.reload()
    admin.locator('[data-i18n="ad.guestLimits"]').click()
    expect(admin.locator('#guest-retry')).to_be_visible()
    expect(admin.locator('#guest-weekly')).to_be_disabled()
    admin.unroute('**/api/admin/upload-policy')
    admin.click('#guest-retry')
    expect(admin.locator('#guest-weekly')).to_have_value('3')
    expect(admin.locator('#guest-weekly')).to_be_enabled()
    assert not errors, errors
    browser.close()
print('PASS policy UI: saved settings, note grants/revocation, size/options, remaining quota, failures/retries, mobile/desktop and themes')
