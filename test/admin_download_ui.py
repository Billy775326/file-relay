import hashlib
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base, digest = sys.argv[1:]
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(accept_downloads=True)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("localStorage.setItem('lang', 'zh')")
    page.goto(base + '/admin')
    page.fill('#admin-token', 'download-test-only')
    page.click('#btn-login')
    expect(page.locator('#shares-body > tr')).to_have_count(6)
    link = page.locator('a[href="/api/admin/shares/100001/download"]')
    expect(page.locator('a[href="/api/admin/shares/100005/download"]')).to_have_count(0)
    for lang in ['zh', 'en']:
        if lang == 'en':
            page.click('#lang-btn')
            expect(link).to_have_text('Download')
        else: expect(link).to_have_text('下载')
        for theme in ['light', 'dark']:
            page.evaluate('(t)=>document.documentElement.dataset.theme=t', theme)
            for width in [320, 390, 1135]:
                page.set_viewport_size({'width': width, 'height': 844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                with page.expect_download() as info:
                    link.click()
                download = info.value
                assert download.failure() is None
                assert download.suggested_filename == '测试报告.txt'
                assert hashlib.sha256(Path(download.path()).read_bytes()).hexdigest() == digest
                assert page.url == base + '/admin'
                expect(page.locator('#admin-panel')).to_be_visible()
                row = page.locator('#shares-body tr').filter(has=link)
                row.locator('button.btn.danger').click()
                expect(page.locator('#del-mask')).to_be_visible()
                page.click('#del-cancel')
    assert not errors, errors
    browser.close()
print('PASS admin download UI: file-only links, saved file bytes/name, no navigation, delete cancel, desktop/mobile, both languages/themes')
