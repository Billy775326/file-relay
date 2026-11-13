import sys
from playwright.sync_api import sync_playwright, expect
base = sys.argv[1].rstrip('/')
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width':320,'height':844})
    page.add_init_script("localStorage.setItem('lang','zh')")
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'/admin')
    page.fill('#admin-token','retention-test-only');page.click('#btn-login')
    field=page.locator('#retention-days')
    expect(field).to_have_value('30');expect(field).to_be_enabled()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='.wrangler/retention-settings-mobile.png', animations='disabled')
    page.fill('#retention-days','7');page.click('#retention-save')
    expect(page.locator('#retention-save')).to_be_enabled()
    assert page.request.get(base+'/api/admin/settings').json()['expiredRetentionDays']==7
    assert page.request.get(base+'/api/admin/shares/200010').status==200
    page.reload();expect(field).to_have_value('7')
    page.route('**/api/admin/settings',lambda route:route.fulfill(status=503,content_type='application/json',body='{"message":"Temporary failure"}') if route.request.method=='PUT' else route.continue_())
    page.fill('#retention-days','2');page.click('#retention-save')
    expect(page.locator('#retention-error')).to_be_visible();expect(field).to_have_value('2')
    assert page.request.get(base+'/api/admin/settings').json()['expiredRetentionDays']==7
    page.unroute('**/api/admin/settings')
    page.click('#retention-save');expect(page.locator('#retention-save')).to_be_enabled()
    assert page.request.get(base+'/api/admin/settings').json()['expiredRetentionDays']==2
    page.route('**/api/admin/settings',lambda route:route.fulfill(status=503,content_type='application/json',body='{"message":"Unavailable"}'))
    page.reload();expect(page.locator('#retention-retry')).to_be_visible();expect(field).to_be_disabled()
    page.unroute('**/api/admin/settings');page.click('#retention-retry');expect(field).to_have_value('2');expect(field).to_be_enabled()
    page.click('#lang-btn');expect(page.locator('label[for="retention-days"]')).to_have_text('Keep after expiry')
    for width in [320,390,1135]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not errors,errors
    browser.close()
print('PASS retention UI: editable/saved setting, reload, retries, error states, narrow layout and language switching')
