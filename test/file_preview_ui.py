import sys
from playwright.sync_api import sync_playwright, expect

base = sys.argv[1]
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.add_init_script("localStorage.setItem('lang','en')")
    page.goto(base + '/admin')
    page.wait_for_timeout(500)
    assert not errors, errors
    page.fill('#admin-token', 'preview-test-only')
    page.click('#btn-login')
    expect(page.locator('#shares-body tr')).to_have_count(16)

    def open_file(name):
        page.locator('.file-detail-link', has_text=name).click()
        expect(page.locator('#file-dialog')).to_be_visible()

    for theme in ['light', 'dark']:
        page.evaluate('(t)=>document.documentElement.dataset.theme=t', theme)
        for width in [320, 736, 1135]:
            page.set_viewport_size({'width': width, 'height': 900})
            open_file('notes.txt')
            expect(page.locator('.file-preview-body pre')).to_contain_text('<script>')
            assert page.evaluate('window.previewXSS') is None
            assert page.locator('#file-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
            page.click('#file-close')
            open_file('list.csv')
            expect(page.locator('.file-preview-table tr')).to_have_count(3)
            expect(page.locator('.file-preview-table')).to_contain_text('one,two')
            expect(page.locator('.file-preview-table')).to_contain_text('line 1\nline 2')
            assert page.locator('#file-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
            if theme == 'dark' and width in [320, 736]:
                page.screenshot(path=f'.wrangler/preview-csv-{width}.png', animations='disabled')
            page.keyboard.press('Escape')
            open_file('tiny.png')
            img = page.locator('.file-preview-image')
            expect(img).to_be_visible()
            page.wait_for_function("document.querySelector('.file-preview-image').naturalWidth===1")
            url = img.get_attribute('src')
            page.click('#file-close')
            assert page.evaluate('async u=>{try{await fetch(u);return false}catch{return true}}', url)
    for name in ['tiny.webp', 'tiny.jpg']:
        open_file(name)
        page.wait_for_function("document.querySelector('.file-preview-image')?.naturalWidth===2")
        page.click('#file-close')
    # CSV edge cases preserve cells and bound large tables without evaluating their text.
    result = page.evaluate('''async () => {
      const {csvExcerpt} = await import('/js/admin-preview.js');
      return [csvExcerpt('a,"b,b"\\n',false), csvExcerpt('a,"unfinished',true),
        csvExcerpt('"a"x,b',false), csvExcerpt('a\\n'.repeat(100),false),
        csvExcerpt(Array(25).fill('cell').join(','),false)];
    }''')
    assert result[0]['rows'] == [['a','b,b']]
    assert result[1]['rows'] == [] and result[1]['clipped']
    assert result[2] is None
    assert len(result[3]['rows']) == 50 and result[3]['clipped']
    assert len(result[4]['rows'][0]) == 20 and result[4]['clipped']
    open_file('file.zip')
    expect(page.locator('.file-preview-body')).to_contain_text('unavailable')
    expect(page.locator('#file-download')).to_be_visible()
    page.click('#file-close')
    open_file('long.txt')
    expect(page.locator('.file-preview-heading')).to_contain_text('Partial')
    page.click('#file-close')
    open_file('page.html')
    expect(page.locator('.file-preview-body pre')).to_contain_text('<img')
    expect(page.locator('.file-preview-body img')).to_have_count(0)
    page.click('#file-close')
    # Failed and cancelled previews must not affect the download or next dialog.
    route = '**/api/admin/shares/200001/preview'
    page.route(route, lambda r: r.fulfill(status=503, body='Unavailable'))
    open_file('notes.txt')
    expect(page.locator('.file-preview-body [role=alert]')).to_be_visible()
    expect(page.locator('#file-download')).to_be_visible()
    page.unroute(route)
    page.locator('.file-preview-body button').click()
    expect(page.locator('.file-preview-body pre')).to_contain_text('Hello preview')
    page.click('#file-close')
    pending = []
    page.route(route, lambda r: pending.append(r))
    open_file('notes.txt')
    expect(page.locator('.file-preview')).to_be_visible()
    page.wait_for_timeout(100)
    page.keyboard.press('Escape')
    open_file('empty.txt')
    expect(page.locator('.file-preview-body')).to_contain_text('Empty file')
    for r in pending:
        try: r.abort()
        except Exception: pass  # The AbortController may have already closed this intercepted request.
    assert 'Hello preview' not in page.locator('.file-preview-body').inner_text()
    assert not errors, errors
    browser.close()
print('PASS preview UI: safe text/CSV/images, unsupported/error/retry, cancellation, blob cleanup, narrow layouts and themes')
