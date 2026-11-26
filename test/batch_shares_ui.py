"""Run real send/pickup/admin flows against the isolated worker."""
import sys
from playwright.sync_api import sync_playwright, expect

base = sys.argv[1].rstrip('/')
files = [
    {'name': '一号说明.txt', 'mimeType': 'text/plain', 'buffer': b'one'},
    {'name': 'second.txt', 'mimeType': 'text/plain', 'buffer': b'two files'},
]
with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    sender = browser.new_context(viewport={'width': 390, 'height': 844})
    sender.add_init_script("localStorage.setItem('lang','zh')")
    page = sender.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + '/')
    expect(page.locator('#text-input')).to_have_attribute('maxlength', '64')
    page.set_input_files('#file-input', files + files)
    expect(page.locator('#btn-upload')).to_be_disabled()
    expect(page.locator('#upload-policy-hint')).to_contain_text('本周还可上传 3 个')
    page.set_input_files('#file-input', files)
    page.locator('#seg-pickups [data-v="1"]').click()
    page.locator('#upload-description').fill('文件批次的说明')
    page.locator('#btn-upload').click()
    expect(page.locator('#results .result')).to_have_count(1, timeout=20000)
    expect(page.locator('#results .result-title')).to_have_text('2 个文件已共享')
    assert page.locator('#results .qr-wrap svg').count() == 1
    code = ''.join(page.locator('#results .code').inner_text().split())
    expect(page.locator('#upload-policy-hint')).to_contain_text('1 / 3')
    recipient = browser.new_context(viewport={'width': 320, 'height': 640}, accept_downloads=True)
    recipient.add_init_script("localStorage.setItem('lang','zh')")
    pickup = recipient.new_page()
    pickup.on('pageerror', lambda error: errors.append(str(error)))
    pickup.goto(base + '/pickup?code=' + code)
    expect(pickup.locator('.batch-file-row')).to_have_count(2)
    expect(pickup.locator('#pickup-result')).to_contain_text('本次取件可下载到')
    for width in [320, 390, 1280]:
        pickup.set_viewport_size({'width': width, 'height': 800})
        for theme in ['light', 'dark']:
            pickup.evaluate('(v)=>document.documentElement.dataset.theme=v', theme)
            assert pickup.evaluate('document.documentElement.scrollWidth <= innerWidth')
    for item in files:
        with pickup.expect_download() as downloaded:
            pickup.get_by_role('link', name='下载 ' + item['name'], exact=True).click()
        assert downloaded.value.suggested_filename == item['name']
        assert downloaded.value.path().read_bytes() == item['buffer']
    pickup.reload()
    expect(pickup.locator('.batch-file-row')).to_have_count(2)

    page.locator('[data-tab="text"]').click()
    expect(page.locator('#upload-policy-hint')).to_be_hidden()
    expect(page.locator('#upload-description')).to_have_value('')
    page.locator('#upload-description').fill('只属于这条文本的说明')
    body = '第一行\n  第二行 <b>文字</b>'
    page.locator('#text-input').fill(body)
    expect(page.locator('#text-counter')).to_contain_text(str(len(body)))
    page.locator('#text-input').press('Control+Enter')
    expect(page.locator('#results .result-meta')).to_contain_text(str(len(body)))
    expect(page.locator('#btn-text')).to_be_disabled()
    text_code = ''.join(page.locator('#results .code').inner_text().split())
    assert text_code != code
    pickup.goto(base + '/pickup?code=' + text_code)
    expect(pickup.locator('.text-body')).to_have_text(body)
    assert pickup.locator('.text-body b').count() == 0

    assert sender.request.post(base + '/api/admin/login', data={'token': 'batch-admin-test-only'}).ok
    text_detail = sender.request.get(base + '/api/admin/shares/' + text_code).json()
    assert text_detail['description'] == '只属于这条文本的说明'
    assert text_detail['text'] == body
    page.goto(base + '/admin')
    row = page.locator('#shares-body tr').filter(has=page.locator('td.mono', has_text=code))
    row.locator('.file-detail-link').click()
    expect(page.locator('#file-title')).to_have_text('批次详情')
    expect(page.locator('#file-detail .batch-file-row')).to_have_count(2)
    expect(page.locator('#file-detail')).to_contain_text('文件批次的说明')
    page.get_by_role('button', name='预览 一号说明.txt', exact=True).click()
    expect(page.locator('.file-preview-body')).to_have_text('one')
    page.locator('#file-edit').click()
    page.locator('#share-edit-status').select_option('active')
    page.locator('#share-edit-form button[type=submit]').click()
    expect(page.locator('#file-detail .batch-file-row')).to_have_count(2)
    assert sender.request.get(base + '/api/admin/shares/' + code).json()['maxPickups'] == 2
    page.locator('#file-close').click()
    row.locator('button.danger').click()
    expect(page.locator('#del-target')).to_contain_text('全部 2 个文件')
    page.locator('#del-ok').click()
    expect(row).to_have_count(0)
    assert not errors, errors
    browser.close()
print('PASS browser batch: quota guard, one QR/code, selected downloads, shared admin rules, deletion and text notes')
