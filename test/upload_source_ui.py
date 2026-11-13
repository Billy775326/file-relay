import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding='utf-8')
base, first, second, visitor = sys.argv[1:]
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.add_init_script("localStorage.setItem('lang','zh')")
    page.goto(base + '/admin')
    page.locator('#admin-login').wait_for(state='visible')
    page.fill('#admin-token', 'source-test-only')
    page.click('#btn-login')
    page.locator('#admin-panel').wait_for(state='visible')
    buttons = page.locator(f'[data-visitor="{visitor}"]')
    buttons.first.wait_for()
    assert buttons.count() >= 2
    assert page.locator('#shares-body').inner_text().find('203.0.113.10') == -1
    buttons.first.click()
    page.locator('#source-form').wait_for(state='visible')
    assert visitor in page.locator('#source-detail').inner_text()
    assert 'IP' in page.locator('#source-detail').inner_text()
    page.locator('#source-history summary').click()
    page.locator('.source-activity').first.wait_for()
    assert page.locator('.source-activity').count() <= 10
    assert page.locator('#source-history-list img').count() == 0
    page.locator('#source-history summary').click()
    page.route('**/api/admin/shares/*/source/activity', lambda route: route.fulfill(status=503, content_type='application/json', body='{"message":"History unavailable"}'))
    page.keyboard.press('Escape')
    buttons.first.click()
    page.locator('#source-form').wait_for(state='visible')
    page.locator('#source-history summary').click()
    page.locator('#source-history-list .error-box').wait_for()
    page.unroute('**/api/admin/shares/*/source/activity')
    page.locator('#source-history-list button').click()
    page.locator('.source-activity').first.wait_for()
    page.keyboard.press('Escape')
    buttons.first.click()
    page.locator('#source-form').wait_for(state='visible')
    note = '<img src=x onerror=alert(1)> 同事'
    page.fill('#source-note', note)
    page.click('#source-save')
    page.locator('#source-dialog').wait_for(state='hidden')
    for button in buttons.all(): assert button.inner_text() == note
    assert page.locator('#shares-body img').count() == 0
    buttons.first.click()
    page.locator('#source-form').wait_for(state='visible')
    assert page.input_value('#source-note') == note
    assert visitor in page.locator('#source-detail').inner_text()
    for theme in ['light', 'dark']:
        page.evaluate('(t) => document.documentElement.dataset.theme = t', theme)
        for width in [1280, 390, 320]:
            page.set_viewport_size({'width': width, 'height': 900})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert page.locator('#source-dialog').evaluate('(el) => el.scrollWidth <= el.clientWidth')
            page.screenshot(path=f'.wrangler/source-{theme}-{width}.png', full_page=True, animations='disabled')
    page.fill('#source-note', '')
    page.click('#source-save')
    page.locator('#source-dialog').wait_for(state='hidden')
    for button in buttons.all(): assert visitor[:8].upper() in button.inner_text()
    # Validation failures keep the dialog and original note available.
    buttons.first.click()
    page.locator('#source-form').wait_for(state='visible')
    page.route('**/api/admin/shares/*/source', lambda route: route.fulfill(status=503, content_type='application/json', body='{"message":"Temporary failure"}') if route.request.method == 'PUT' else route.continue_())
    page.fill('#source-note', 'retry note')
    page.click('#source-save')
    page.locator('#source-error').wait_for(state='visible')
    assert page.input_value('#source-note') == 'retry note'
    page.keyboard.press('Escape')
    page.locator('#source-dialog').wait_for(state='hidden')
    assert page.locator('#source-detail').inner_text() == ''
    page.unroute('**/api/admin/shares/*/source')
    page.click('#lang-btn')
    page.wait_for_function("document.querySelector('[data-i18n=\"ad.source\"]').textContent === 'Upload source'")
    buttons.first.click()
    page.locator('#source-form').wait_for(state='visible')
    assert page.locator('#source-save').inner_text() == 'Save note'
    browser.close()
print('PASS source UI: city, private IP, visitor notes, clearing, safe text, failure, dialog and responsive themes')
