"""Isolated uploads exercise both request formats and the admin information boundary."""
import sys
from playwright.sync_api import sync_playwright, expect

sys.stdout.reconfigure(encoding='utf-8')
base, visitor_cookie, backend = sys.argv[1:]
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width': 390, 'height': 844})
    key, value = visitor_cookie.split('=', 1)
    context.add_cookies([{'name': key, 'value': value, 'url': base}])
    context.add_init_script("if (!localStorage.getItem('lang')) localStorage.setItem('lang','zh')")
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(base + '/')
    expect(page.locator('#seg-expiry [data-v="forever"]')).to_be_enabled()
    page.locator('.upload-context summary').click()
    page.get_by_label('怎么称呼你', exact=True).fill('同事 <img src=x>')
    description = '本周图片素材 <img src=x onerror=alert(1)>\n请保留原文件名。'
    page.get_by_label('文件说明', exact=True).fill(description)
    expect(page.locator('#description-count')).to_have_text(f'{len(description)} / 300')
    for lang in ['zh', 'en']:
        if lang == 'en': page.click('#lang-btn')
        for theme in ['light', 'dark']:
            page.evaluate('(t)=>document.documentElement.dataset.theme=t', theme)
            for width in [320, 390, 1135]:
                page.set_viewport_size({'width': width, 'height': 844})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                for control in ['upload-name', 'upload-description']:
                    assert page.locator('#' + control).evaluate('(e)=>e.scrollWidth<=e.clientWidth')
                if lang == 'zh' and theme == 'dark' and width in [390, 1135]:
                    page.locator('.upload-context').screenshot(path=f'.wrangler/upload-context-{backend}-{width}.png')
    page.click('#lang-btn')
    # Text mode hides file-only description without losing it on returning to files.
    page.click('[data-tab="text"]')
    expect(page.locator('#upload-description-field')).to_be_hidden()
    expect(page.locator('#upload-name')).to_have_value('同事 <img src=x>')
    page.click('[data-tab="file"]')
    expect(page.locator('#upload-description')).to_have_value(description)
    page.set_input_files('#file-input', [
        {'name': '设计素材_' + '长文件名' * 12 + '.txt', 'mimeType': 'text/plain', 'buffer': b'abc'},
        {'name': 'second.txt', 'mimeType': 'text/plain', 'buffer': b'def'},
    ])
    page.click('#btn-upload')
    expect(page.locator('#results .result .code')).to_have_count(2)
    codes = [''.join(item.inner_text().split()) for item in page.locator('#results .result .code').all()]
    page.goto(base + '/admin')
    page.fill('#admin-token', 'source-test-only')
    page.click('#btn-login')
    expect(page.locator('#admin-panel')).to_be_visible()
    for code in codes:
        assert page.request.get(base + f'/api/admin/shares/{code}').json()['description'] == description
        source = page.request.get(base + f'/api/admin/shares/{code}/source').json()['source']
        assert source['displayName'] == '同事 <img src=x>'
        assert 'submission' not in source and 'description' not in source
        assert 'Chrome' in source['userAgent']
        public = page.request.post(base + '/api/pickup', data={'code': code}).text()
        assert 'description' not in public and 'displayName' not in public
    row = page.locator('#shares-body tr').filter(has=page.locator('td.mono', has_text=codes[0]))
    for lang in ['zh', 'en']:
        if lang == 'en': page.click('#lang-btn')
        for theme in ['light', 'dark']:
            page.evaluate('(t)=>document.documentElement.dataset.theme=t', theme)
            for width in [320, 390, 1135]:
                page.set_viewport_size({'width': width, 'height': 844})
                row.locator('.file-detail-link').click()
                expect(page.locator('.file-description p')).to_have_text(description)
                expect(page.locator('#file-detail')).to_contain_text('同事 <img src=x>')
                expect(page.locator('#file-detail')).not_to_contain_text('最早清理')
                expect(page.locator('#file-detail')).not_to_contain_text('Cleanup after')
                expect(page.locator('#file-detail img')).to_have_count(0)
                assert 'User-Agent' not in page.locator('#file-detail').inner_text()
                assert page.locator('#file-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
                page.locator('.file-source-link').click()
                expect(page.locator('#source-detail')).to_contain_text('同事 <img src=x>')
                expect(page.locator('#source-detail img')).to_have_count(0)
                assert description not in page.locator('#source-detail').inner_text()
                page.locator('#source-history summary').click()
                page.locator('.source-activity').first.wait_for()
                assert page.locator('#source-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
                # Native modal focus never escapes to the page underneath.
                page.locator('#source-save').focus()
                page.keyboard.press('Tab')
                assert page.evaluate("document.activeElement.closest('dialog')?.id === 'source-dialog'")
                if lang == 'zh' and theme == 'dark' and width in [390, 1135]:
                    page.screenshot(path=f'.wrangler/context-source-{backend}-{width}.png', animations='disabled')
                page.click('#source-back')
                expect(page.locator('#file-dialog')).to_be_visible()
                expect(page.locator('.file-description p')).to_have_text(description)
                if lang == 'zh' and theme == 'dark' and width in [390, 1135]:
                    page.screenshot(path=f'.wrangler/context-file-{backend}-{width}.png', animations='disabled')
                page.keyboard.press('Escape')
                expect(page.locator('#file-dialog')).not_to_be_visible()
                row.locator('.btn.danger').click()
                expect(page.locator('#del-cancel')).to_be_focused()
                page.keyboard.press('Shift+Tab')
                assert page.evaluate("document.activeElement.closest('dialog')?.id === 'del-mask'")
                page.keyboard.press('Escape')
                expect(page.locator('#del-mask')).not_to_be_visible()
                expect(row.locator('.btn.danger')).to_be_focused()
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
    assert not errors, errors
    browser.close()
print(f'PASS upload context UI ({backend}): batch description/name, private fields, safe text, modal navigation/focus, languages/themes and 320/390/1135 widths')
