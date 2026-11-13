import json
import hashlib
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base, digest, filename = sys.argv[1:]
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
    row = page.locator('#shares-body tr').filter(has=page.locator('td.mono', has_text='100001'))
    name = row.locator('.file-detail-link')
    link = page.locator('#file-download')
    expect(page.locator('#shares-body a[download]')).to_have_count(0)
    expect(page.locator('#shares-body tr').filter(has=page.locator('td.mono', has_text='100005')).locator('.file-detail-link')).to_have_count(0)
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
                name.click()
                expect(link).to_be_visible()
                assert filename in page.locator('#file-detail').inner_text()
                expect(page.locator('.file-source-link')).to_have_text('示例好友')
                assert 'Hangzhou' not in page.locator('#file-detail').inner_text()
                assert '203.0.113.42' not in page.locator('#file-detail').inner_text()
                assert 'TXT' in page.locator('.file-identity').inner_text()
                page.locator('.file-technical summary').click()
                assert 'application/octet-stream' in page.locator('.file-technical').inner_text()
                assert page.locator('#file-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
                if lang == 'zh' and theme == 'dark' and width in [390, 1135]:
                    page.screenshot(path=f'.wrangler/file-details-{width}.png', animations='disabled')
                with page.expect_download() as info:
                    link.click()
                download = info.value
                assert download.failure() is None
                assert download.suggested_filename == filename
                assert hashlib.sha256(Path(download.path()).read_bytes()).hexdigest() == digest
                assert page.url == base + '/admin'
                expect(page.locator('#admin-panel')).to_be_visible()
                page.click('#file-close')
                expect(page.locator('#file-dialog')).not_to_be_visible()
                assert page.locator('#file-detail').inner_text() == ''
                assert link.get_attribute('href') is None
                row.locator('button.btn.danger').click()
                expect(page.locator('#del-mask')).to_be_visible()
                page.click('#del-cancel')
    # Reuse the source dialog, including safe note edits and private IP access there.
    name.click()
    page.locator('.file-source-link').click()
    expect(page.locator('#file-dialog')).not_to_be_visible()
    expect(page.locator('#source-dialog')).to_be_visible()
    expect(page.locator('#source-detail')).to_contain_text('203.0.113.42')
    expect(page.locator('#source-detail')).to_contain_text('Hangzhou')
    page.click('#source-back')
    expect(page.locator('#file-dialog')).to_be_visible()
    page.locator('.file-source-link').click()
    updated_note = 'Updated fixture <img src=x>'
    page.fill('#source-note', updated_note)
    page.click('#source-save')
    expect(page.locator('#source-dialog')).not_to_be_visible()
    name.click()
    expect(page.locator('.file-source-link')).to_have_text(updated_note)
    expect(page.locator('#file-detail img')).to_have_count(0)
    page.click('#file-close')
    for code, text, downloadable in [('100004', 'Awaiting cleanup', False), ('100003', 'Retained after expiry', True), ('100002', 'Kept for 30 days after expiry', True)]:
        page.locator('#shares-body tr').filter(has=page.locator('td.mono', has_text=code)).locator('.file-detail-link').click()
        expect(page.locator('#file-detail')).to_contain_text(text)
        if downloadable: expect(link).to_be_visible()
        else:
            expect(link).not_to_be_visible()
            expect(page.locator('#file-detail')).to_contain_text('File missing')
        page.click('#file-close')
    unknown = page.request.get(base + '/api/admin/shares/100001').json()
    unknown['storage'] = {'state': 'unknown', 'size': None, 'uploadedAt': None}
    page.route('**/api/admin/shares/100001', lambda route: route.fulfill(content_type='application/json', body=json.dumps(unknown)))
    name.click()
    expect(page.locator('#file-detail')).to_contain_text('Unable to verify')
    expect(link).to_have_text('Try download')
    expect(link).to_be_visible()
    page.click('#file-close')
    page.unroute('**/api/admin/shares/100001')
    # Closing a loading dialog must discard late details and the download link.
    pending = []
    page.route('**/api/admin/shares/100001', lambda route: pending.append(route))
    name.click()
    expect(page.locator('#file-dialog')).to_be_visible()
    expect(link).not_to_be_visible()
    page.keyboard.press('Escape')
    expect(page.locator('#file-dialog')).not_to_be_visible()
    assert pending
    pending.pop().fulfill(content_type='application/json', body='{"filename":"late.txt","size":1,"mime":"text/plain","status":"active","pickupCount":0,"maxPickups":null,"createdAt":1,"expireAt":null,"cleanupAfter":null}')
    page.wait_for_timeout(100)
    assert page.locator('#file-detail').inner_text() == ''
    assert link.get_attribute('href') is None
    page.unroute('**/api/admin/shares/100001')
    page.route('**/api/admin/shares/100001', lambda route: route.fulfill(status=404, content_type='application/json', body='{"error":"not_found","message":"File removed"}'))
    name.click()
    expect(page.locator('#file-detail')).to_have_text('File removed')
    expect(link).not_to_be_visible()
    page.click('#file-close')
    assert not errors, errors
    browser.close()
print('PASS admin download UI: filename details, full name, saved bytes/name, stale responses, missing records, no navigation, delete cancel, desktop/mobile, both languages/themes')
